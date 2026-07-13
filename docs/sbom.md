# 소프트웨어 자재 명세서(SBOM)

CI는 각 변경에서 CycloneDX JSON SBOM을 생성해 artifact로 보관합니다.

```bash
npx --yes @cyclonedx/cyclonedx-npm --output-file sbom.json
```

SBOM에는 lockfile 기준 직접·전이 의존성, 버전, 라이선스 메타데이터가 포함됩니다. 공개 출시 전 다음을 확인합니다.

- production 범위의 알려진 심각한 취약점이 없는가
- `THIRD_PARTY_NOTICES.md`의 직접 의존성 고지와 일치하는가
- 누락되거나 `UNKNOWN`인 라이선스를 수동 검토했는가
- SBOM이 실제 배포 커밋·이미지 digest·모바일 버전과 연결되어 있는가

SBOM은 사용자 개인정보나 API 키를 포함해서는 안 됩니다.
