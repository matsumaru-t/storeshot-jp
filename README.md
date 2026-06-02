# StoreShot JP

App StoreとGoogle Play向けのスクリーンショット素材をブラウザだけで作る日本語ツールです。
タスク管理、家計簿、学習記録、ヘルスケア向けの用途別コピー・配色テンプレートも備えています。
制作代行向けの静的ページは `public/service.html` です。

## 公開URL

- 無料ツール: https://matsumaru-t.github.io/storeshot-jp/
- ストア画像制作代行: https://matsumaru-t.github.io/storeshot-jp/service.html
- 制作代行の相談フォーム: https://github.com/matsumaru-t/storeshot-jp/issues/new?template=service-order.yml&title=%E3%82%B9%E3%83%88%E3%82%A2%E7%94%BB%E5%83%8F%E5%88%B6%E4%BD%9C%E4%BB%A3%E8%A1%8C%E3%81%AE%E4%BE%9D%E9%A0%BC

## 収益モデル

- 無料版: PNG単体書き出し。透かし入りでツール名を拡散します。
- Pro版: 透かしなし、全サイズZIP一括書き出し。想定価格は980円。
- 制作代行: ストア素材の作成代行。想定価格は9,800円。

月1〜2万円の目安は、制作代行1〜2件、またはPro版10〜20件です。

## 開発

```bash
npm install
npm run dev
```

## 公開前の設定

`.env.example` を `.env` にコピーして、決済・制作代行リンクを設定します。

```bash
VITE_PAYMENT_LINK=https://buy.stripe.com/your-payment-link
VITE_SERVICE_LINK=https://example.com/store-screenshot-service
VITE_PRO_CODE=replace-with-your-fulfillment-code
VITE_CONTACT_EMAIL=you@example.com
```

Stripe Payment Linksを使うと、サーバーを持たずに決済リンクを作れます。購入後に渡すライセンスコードは `VITE_PRO_CODE` で設定します。静的フロントエンドだけでは厳密な不正利用防止はできないため、本番で自動販売する場合はサーバー側のライセンス検証を追加してください。

決済リンクや問い合わせ先を設定するまでは、GitHub Issueで購入希望と制作代行依頼を受け付けます。`VITE_CONTACT_EMAIL` を設定すると制作代行の問い合わせはメールに切り替わります。

## ビルド

```bash
npm run build
```

生成された `dist/` をNetlify、Vercel、Cloudflare Pages、GitHub Pagesなどに公開します。

## 初期集客

1. Xで「App Store スクショ 作成」「Google Play スクショ 作成」に刺さる作例を毎日1本投稿する。
2. 個人開発者コミュニティに無料版を投下し、改善要望を集める。
3. 使った人に「制作代行9,800円」を直接案内する。
4. Pro版は初月だけ980円、改善後は1,480円に上げる。

投稿文と問い合わせ返信テンプレートは `marketing/launch-kit.md` にあります。
