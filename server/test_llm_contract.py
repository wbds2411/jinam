import copy
import unittest
import app
from test_app import READING

class ValidationTests(unittest.TestCase):
    def test_future_certainty_is_rejected(self):
        for text in ['재물운이 상승할 것입니다.', '당첨은 확실합니다.', '행운을 가져다주는 수입니다.', '풍요를 얻게 될 징조입니다.']:
            value = copy.deepcopy(READING)
            value['summary'] = text
            with self.assertRaises(ValueError):
                app.validate_reading(value, {'dream'})

    def test_number_candidates_need_actual_evidence(self):
        value = copy.deepcopy(READING)
        value['numberCandidates'][0]['evidenceIds'] = []
        with self.assertRaises(ValueError):
            app.validate_reading(value, {'dream'})

if __name__ == '__main__':
    unittest.main()
