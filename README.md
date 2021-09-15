# JPYCstabilizer

see article on hide.ac [https://hide.ac/articles/ZZoaKG4yb](https://hide.ac/articles/ZZoaKG4yb)

## update log

### [v.20210915.0](https://github.com/Nuko973663/JPYCstabilizer/releases/tag/v.20210915.0)

- sushiswap の slippage を変更（0.6% → 0.75%）
- target rate を実レートに合わせていったん修正 116.7 +/- 1.0 + rand
- minor fix

### [v.20210914.2](https://github.com/Nuko973663/JPYCstabilizer/releases/tag/v.20210914.2)

- sushi swap 対応
- approval の状態取得に対応。承認済みの場合は approve ボタンをグレーアウト
- QuickSwap と SushiSwap の流動性プールを表示

### [v.20210914.1](https://github.com/Nuko973663/JPYCstabilizer/releases/tag/v.20210914.1)

- target rate bug fix

### [v.20210914.0](https://github.com/Nuko973663/JPYCstabilizer/releases/tag/v.20210914.0)

- JPYC/USDC のターゲットレート（swap トリガーレート）を 2021-10-10T10:10:10.000Z にかけて徐々に修正
- swap ログを 100 件 localStrage に保存
- swap のトグルの状態を localStrage に保存

### [v.20210913.0](https://github.com/Nuko973663/JPYCstabilizer/releases/tag/v.20210913.0)

- ドル円レートの表示
- gas 代を fastest, fast, normal の 3 種類を選ぶ機能を追加
- トランザクション完了時に実際に消費したガス代を Activity Log に表示
- swap のトリガーレート（upper, lower）を表示
- swap レートを（116, 118）→（115.9, 117.9）に変更

### [v.20210912.0](https://github.com/Nuko973663/JPYCstabilizer/releases/tag/v.20210912.0)

- initial release
