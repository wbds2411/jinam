import copy
import json
import tempfile
import threading
import unittest
from pathlib import Path
from unittest.mock import patch
import httpx
import app

READING = {'summary': '꿈과 가족 관계를 함께 돌아봅니다.', 'sections': [{'title': '꿈', 'text': '돼지는 풍요에 대한 기대를 상징할 수 있습니다.', 'evidenceIds': ['dream']}], 'numberCandidates': [{'number': 12, 'reason': '돼지에 임의로 대응한 상징 수', 'evidenceIds': ['dream']}], 'followUp': ''}


class GatewayTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.data = patch.object(app, 'DATA', Path(self.tmp.name))
        self.data.start()
        self.server = app.ThreadingHTTPServer(('127.0.0.1', 0), app.Handler)
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        self.client = httpx.Client(base_url=f'http://127.0.0.1:{self.server.server_port}', headers={'Host': 'localhost:3000'}, timeout=10)
        self.assertEqual(self.client.get('/api/session').status_code, 200)

    def tearDown(self):
        self.client.close()
        self.server.shutdown()
        self.server.server_close()
        self.data.stop()
        self.tmp.cleanup()

    def add(self, **values):
        response = self.client.post('/api/connections/save', json={'provider': 'ollama', 'model': 'test', 'enabled': True, **values})
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()

    def test_catalog_secrets_permissions_and_key_update(self):
        row = self.add(provider='openai', apiKey='test-private-key', consent=True, baseUrl='https://evil.example')
        self.assertNotIn('apiKey', row)
        self.assertEqual(row['baseUrl'], 'https://api.openai.com/v1')
        response = self.client.get('/api/connections')
        self.assertNotIn('test-private-key', response.text)
        self.assertEqual(len(response.json()['catalog']['providers']), 12)
        self.assertEqual((app.DATA / 'connections.json').stat().st_mode & 0o777, 0o600)
        self.add(**{key: value for key, value in row.items() if key not in ('hasKey',)}, apiKey='')
        self.assertEqual(app.load()[0]['apiKey'], 'test-private-key')

    def test_consent_local_scope_and_cli_gate(self):
        self.assertEqual(self.client.post('/api/connections/save', json={'provider': 'openai', 'apiKey': 'secret', 'enabled': True}).status_code, 400)
        self.assertEqual(self.client.post('/api/connections/save', json={'provider': 'ollama', 'baseUrl': 'https://public.example', 'enabled': True}).status_code, 400)
        with patch.dict(app.os.environ, {'JINAM_ALLOW_CLI': '0'}):
            self.assertEqual(self.client.post('/api/connections/save', json={'provider': 'codex-cli', 'enabled': True, 'consent': True}).status_code, 400)

    def test_csrf_host_and_session(self):
        self.assertEqual(self.client.get('/api/connections', headers={'Host': 'evil.example'}).status_code, 403)
        self.assertEqual(self.client.post('/api/connections/save', headers={'Origin': 'https://evil.example'}, json={}).status_code, 403)
        self.client.cookies.clear()
        self.assertEqual(self.client.get('/api/connections').status_code, 401)

    def test_stream_success_retry_and_no_fallback(self):
        row = self.add()
        invalid = copy.deepcopy(READING)
        invalid['sections'][0]['evidenceIds'] = ['made-up']
        calls = []
        def fake(conn, *args, **kwargs):
            calls.append(conn.provider)
            yield {'type': 'delta', 'text': json.dumps(invalid if len(calls) == 1 else READING)}
            yield {'type': 'done'}
        with patch.object(app, 'generate', fake):
            response = self.client.post('/api/reading', json={'id': row['id'], 'mode': 'dream', 'facts': [{'id': 'dream', 'value': '돼지 꿈'}]})
        events = [json.loads(line) for line in response.text.splitlines()]
        self.assertEqual(events[-1]['type'], 'done')
        self.assertEqual(calls, ['ollama', 'ollama'])
        self.assertEqual(len([event for event in events if event['type'] == 'stage']), 2)

    def test_incomplete_and_failed_provider_do_not_succeed(self):
        row = self.add()
        def fake(*args, **kwargs):
            yield {'type': 'delta', 'text': json.dumps(READING)}
        with patch.object(app, 'generate', fake):
            response = self.client.post('/api/reading', json={'id': row['id'], 'facts': [{'id': 'dream', 'value': '돼지'}]})
        events = [json.loads(line) for line in response.text.splitlines()]
        self.assertEqual(events[-1]['type'], 'error')
        self.assertNotIn('done', [event['type'] for event in events])

    def test_disabled_and_deleted_connection(self):
        row = self.add(enabled=False)
        self.assertEqual(self.client.post('/api/reading', json={'id': row['id']}).status_code, 400)
        self.assertEqual(self.client.post('/api/connections/delete', json={'id': row['id']}).status_code, 200)
        self.assertEqual(self.client.get('/api/connections').json()['connections'], [])

    def test_model_catalog_save_default_reopen_and_generation(self):
        row = self.add(provider='codex-cli', model='old-model', consent=True)
        other = self.add()
        metadata = {'models': ['new-model'], 'model_choices': [{'id': 'new-model', 'label': 'New model', 'is_default': False}], 'model_source': 'codex_app_server', 'configured_model': 'old-model', 'access_verified': False, 'model_note': '권한 미검증'}
        with patch.object(app, 'model_catalog', return_value=metadata) as fetch:
            result = self.client.post('/api/connections/models', json={'id': row['id']})
            self.assertEqual(result.json(), metadata)
            self.assertEqual(fetch.call_args.args[0].model, 'old-model')
        self.assertEqual(app.load()[0]['model'], 'old-model')
        with patch.object(app, 'model_catalog', side_effect=app.ProviderError('조회 실패')):
            self.assertEqual(self.client.post('/api/connections/models', json={'id': row['id']}).status_code, 400)
        self.assertEqual(app.load()[0]['model'], 'old-model')
        self.add(**{key: value for key, value in row.items() if key not in ('hasKey', 'model')}, model='new-model')
        self.assertEqual(self.client.post('/api/connections/default', json={'id': row['id']}).status_code, 200)
        reopened = self.client.get('/api/connections').json()
        self.assertEqual(reopened['defaultConnectionId'], row['id'])
        self.assertEqual(next(item for item in reopened['connections'] if item['id'] == row['id'])['model'], 'new-model')
        calls = []
        def fake(conn, *args, **kwargs):
            calls.append((conn.provider, conn.model))
            yield {'type': 'delta', 'text': json.dumps(READING)}
            yield {'type': 'done'}
        with patch.object(app, 'generate', fake):
            result = self.client.post('/api/reading', json={'id': row['id'], 'facts': [{'id': 'dream', 'value': '공개 합성 자료'}]})
        self.assertEqual(json.loads(result.text.splitlines()[-1])['type'], 'done')
        self.assertEqual(calls, [('codex-cli', 'new-model')])
        self.assertTrue(next(item for item in app.load() if item['id'] == other['id'])['enabled'])

    def test_explicit_remote_host_and_origin(self):
        host = '100.119.226.86:5175'
        with patch.dict(app.os.environ, {'JINAM_ALLOWED_HOSTS': host}):
            self.assertEqual(self.client.get('/api/session', headers={'Host': host}).status_code, 200)
            self.assertEqual(self.client.get('/api/connections', headers={'Host': host}).status_code, 200)
            self.assertEqual(self.client.post('/api/connections/preview/status', headers={'Host': host, 'Origin': 'http://evil.example'}, json={'provider': 'codex-cli'}).status_code, 403)
            self.assertEqual(self.client.get('/api/session', headers={'Host': '100.100.100.100:5175'}).status_code, 403)

    def test_preview_models_and_status_do_not_save(self):
        with patch.object(app, 'model_catalog', return_value={'configured_model': 'gpt-test', 'model_choices': []}), patch.object(app, 'status', return_value={'state': 'connected', 'auth_method': 'chatgpt'}):
            self.assertEqual(self.client.post('/api/connections/preview/models', json={'provider': 'codex-cli'}).json()['configured_model'], 'gpt-test')
            self.assertEqual(self.client.post('/api/connections/preview/status', json={'provider': 'codex-cli'}).json()['state'], 'connected')
        self.assertEqual(app.load(), [])
        with patch.dict(app.os.environ, {'JINAM_ALLOW_CLI': '0'}):
            self.assertEqual(self.client.post('/api/connections/preview/models', json={'provider': 'codex-cli'}).status_code, 400)

    def test_number_and_evidence_validation(self):
        for number in [0, 46, True, 1.5]:
            invalid = copy.deepcopy(READING)
            invalid['numberCandidates'][0]['number'] = number
            with self.assertRaises(ValueError):
                app.validate_reading(invalid, {'dream'})
        self.assertIn('임의의 상징 대응', app.validate_reading(copy.deepcopy(READING), {'dream'})['numberCandidates'][0]['reason'])


if __name__ == '__main__':
    unittest.main()
