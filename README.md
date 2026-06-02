# StoreShot JP

App StoreとGoogle Play向けのスクリーンショット素材をブラウザだけで作る日本語ツールです。

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
```

Stripe Payment Linksを使うと、サーバーを持たずに決済リンクを作れます。購入後に渡すライセンスコードは、MVPでは `STORESHOT-LAUNCH` です。本番で不正利用を厳密に防ぐ場合は、サーバー側のライセンス検証を追加してください。

決済リンクを設定するまでは、GitHub Issueで購入希望と制作代行依頼を受け付けます。

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
