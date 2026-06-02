# StoreShot JP

App StoreとGoogle Play向けのスクリーンショット素材をブラウザだけで作る日本語ツールです。
タスク管理、家計簿、学習記録、ヘルスケア向けの用途別コピー・配色テンプレートも備えています。
Pro販売向けの静的ページは `public/pro.html`、作成ガイドは `public/guide.html` です。

## 公開URL

- 無料ツール: https://matsumaru-t.github.io/storeshot-jp/
- Pro販売ページ: https://matsumaru-t.github.io/storeshot-jp/pro.html
- 作成ガイド: https://matsumaru-t.github.io/storeshot-jp/guide.html
- Pro購入フォーム: https://github.com/matsumaru-t/storeshot-jp/issues/new?template=pro-order.yml&title=Pro%E7%89%88%E3%81%AE%E8%B3%BC%E5%85%A5%E5%B8%8C%E6%9C%9B

## 収益モデル

- 無料版: PNG単体書き出し。透かし入りでツール名を拡散します。
- Pro版: 透かしなし、全サイズZIP一括書き出し。想定価格は980円。

月1〜2万円の目安は、Pro版を月11〜21件販売する設計です。

## 開発

```bash
npm install
npm run dev
```

## 公開前の設定

`.env.example` を `.env` にコピーして、決済リンクとProコードを設定します。

```bash
VITE_PAYMENT_LINK=https://buy.stripe.com/your-payment-link
VITE_PRO_CODE=replace-with-your-fulfillment-code
```

Stripe Payment Linksを使うと、サーバーを持たずに決済リンクを作れます。購入後に渡すライセンスコードは `VITE_PRO_CODE` で設定します。静的フロントエンドだけでは厳密な不正利用防止はできないため、本番で自動販売する場合はサーバー側のライセンス検証を追加してください。

決済リンクを設定するまでは、GitHub IssueでPro購入希望を受け付けます。

## ビルド

```bash
npm run build
```

生成された `dist/` をNetlify、Vercel、Cloudflare Pages、GitHub Pagesなどに公開します。

## 初期集客

1. Xで「App Store スクショ 作成」「Google Play スクリーンショット 作成」に刺さる作例を毎日1本投稿する。
2. 個人開発者コミュニティに無料版と作成ガイドを投下し、改善要望を集める。
3. ZIP一括書き出しが必要な人にPro版980円を案内する。
4. Pro版は初月だけ980円、改善後は1,480円に上げる。

投稿文と問い合わせ返信テンプレートは `marketing/launch-kit.md` にあります。
