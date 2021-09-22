# JPYCstabilizer

see article on hide.ac [https://hide.ac/articles/ZZoaKG4yb](https://hide.ac/articles/ZZoaKG4yb)

## to do

- dark mode の実装
- ウォレットアドレスの非表示オプション
- リーダーボード実装
- 報酬履歴表示
- スタビの APR 表示
- 流動性プールの APR 表示

## update log

### [v.20210922.1](https://github.com/Nuko973663/JPYCstabilizer/releases/tag/v.20210922.1)

- Fixed threshold 用 strategy analysis view の追加

### [v.20210922.0](https://github.com/Nuko973663/JPYCstabilizer/releases/tag/v.20210922.0)

- トレードレートの設定機能の追加
- リファクタリング

### [v.20210921.0](https://github.com/Nuko973663/JPYCstabilizer/releases/tag/v.20210921.0)

- CommunityBalance 実装

### [v.20210918.0](https://github.com/Nuko973663/JPYCstabilizer/releases/tag/v.20210918.0)

- gas 代の MATIC の自動補充機能を追加（デフォルトオフ）: thanks to medy.nim さん @dumblepytech1
- RPC node から切断された場合に他の RPC ノードに自動的に接続する機能を追加
- [bugfix] token を approve していない状態で自動スワップを on にしても swap がトリガーされないように変更

### [v.20210916.0](https://github.com/Nuko973663/JPYCstabilizer/releases/tag/v.20210916.0)

- added favicon: thanks to コイケさん @koikedesuyoo
- アクティブユーザー数を表示
- TX 送信時に Activity log に表示する gas 代を gasPrice（gwei）から estimated gas fee（MATIC）に変更
- Update 時に自動リロードするかのオプションを追加（デフォルト Off）

### [v.20210915.1](https://github.com/Nuko973663/JPYCstabilizer/releases/tag/v.20210915.1)

- gas pref に faster を追加: (fastest + fast) /2
- spread の変更機能を追加
- 1 時間に 1 回最新バージョンを確認し、リリースされていれば再読み込みする機能を追加
- 最低 swap を設定するオプションを追加

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
