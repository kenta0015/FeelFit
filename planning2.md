## Step 1：Plan Runner 画面を新規作成する（“プラン通りに進む”中核）

目的
Suggestion で生成された Plan.blocks を、順番に「実行」できる画面を作る。
既存の /workout/session（単発運動）とは分離する。

やること（仕様反映）

画面ルート例：/workout/plan-session（名前はプロジェクトの命名に合わせる）

状態として最低限これを持つ

currentBlockIndex（今のブロック番号）

phase（work or rest）

restSeconds = 60（固定、スキップ常時表示）

completionPercentage（途中停止時の%）

表示はまず最短：タイトル + タイマー + 簡単な説明（あなたの A 案）

ブロック終了 → 次があれば 休憩 60 秒 → 次ブロックへ

休憩は Skip ボタン常時

途中停止は completionPercentage を使って %比例の処理へ渡す準備

Step 1 の完了条件（ここができたら成功）

ダミーでも良いので Plan.blocks を渡すと、ブロック → 休憩 → ブロック… と進む

休憩スキップで即次に行ける

途中停止で “今どこまで進んだか” が状態として残せる（保存は Step 3 で）

## Step 2：Suggestion の Start を Plan Runner に接続する（ズレの根本解消）

目的
いま “duration だけ渡して単発画面へ行く” せいで EXERCISES[0] になる。
これを **「Plan Runner に plan を渡して開始」**に変える。

やること

Suggestion 側の Start を変更して、Plan を Plan Runner に渡す

URL params で巨大 JSON を渡すのは壊れやすいので、おすすめは：

ローカルに “activePlan” を保存 → Plan Runner がそれを読む
（Web でも扱いやすい）

Step 2 の完了条件

Suggestion で見えている plan の最初のブロックが、Plan Runner でそのまま開始される

“プランと別の運動が始まる” が再現しない

## Step 3：途中再開（Resume/Discard）＋ログ（ハイブリッド）＋スタミナ反映を確定させる

目的
あなたの仕様の核心（再開、ハイブリッドログ、ブロック完了ごとスタミナ反映）を入れて「実用」にする。

やること

ローカル保存（進行中）

activePlanRun（現在の block、phase、残り秒、各ブロックの進捗%）を保存

アプリ復帰時に activePlanRun があれば

Resume / Discard ダイアログ

スタミナ反映

ブロック完了時に category を見て

mental → Mental stamina 加算

physical → Physical stamina 加算

途中停止は %比例 で加算

Supabase（確定ログ）

ブロック完了ごと、またはセッション完了時に送る（どちらにするかは実装都合で決めて OK）

失敗したらローカルに未送信キュー → 次回再送（ハイブリッドの要）

Step 3 の完了条件

途中で閉じても復帰時に Resume/Discard が出る

Resume すると続きから再開できる

ブロック完了ごとにスタミナが上がる（混在しても正しく反映）

ログがローカルに残り、Supabase にも最終的に残る（ネット不安定でも破綻しない）

次はこの順で進めます。
あなたの「Step 1」は上の **Step 1（Plan Runner 画面の新規作成）**です。

このまま **Step 1 の実装対象ファイル（新規作成する画面ファイル名/置き場所）**を、ZIP の既存ルーティング規約に合わせてこちらで確定してから、コードに入ります。
