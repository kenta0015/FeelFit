Suggestion タブ（/(tabs)/index.tsx）

location.pathname === '/'、git grep "<WorkoutTimer" で index.tsx のみ命中 →
<WorkoutTimer /> は Suggestion タブに実装済み。

Choose から見えているタイマー画面は、実体はこの index 画面に遷移しているだけ。

/workout（Test）

エンジン直叩きの検証用ハーネス。feelFit:workout-\* を発火して連携確認するための画面。

<WorkoutTimer /> は使っていない。

Player（HUD）

feelFit:\* イベントで状態同期。

TTS（Eleven/Expo）＋ ducking ＋ BGM ミキサーはイベント駆動で動作 OK。

補足

git grep "Instructions:" がヒットしないのは、表示文言が別コンポーネント/データ由来（直書きでない）ためと考えられる。機能面の整理には影響なし。
