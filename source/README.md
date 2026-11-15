# 奶国之冬：奶家人上车！ | Winter in Milktopia

以赛车为主线的浏览器三维互动乐园。此目录包含可读的 JavaScript / Three.js 游戏源码、样式、测试、构建配置及联网账号/成绩服务的业务源码；并非压缩后的网页发布包。

## 评审入口

- [直接试玩](https://zuoyo-tracy.github.io/naiguo-winter/?scene=grand-palace&trial=1)：点击免登录试玩，无需提供账号。
- [PDF 项目报告](https://zuoyo-tracy.github.io/naiguo-winter/review/Winter-in-Milktopia-Project-Report.pdf)
- [源码 ZIP](https://zuoyo-tracy.github.io/naiguo-winter/review/Winter-in-Milktopia-Source.zip)

## 本地运行

建议 Node.js 24 LTS（与本次测试一致）。克隆本仓库后进入 `source`，或解压源码 ZIP 后进入其 `source` 目录：

```sh
npm ci
node tools/prepare-assets.mjs
npm run dev
```

打开终端给出的地址，点击免登录试玩。资源脚本优先从完整仓库的相邻 `assets` / `ui` 目录复制，独立源码包则从公开试玩站点下载同一份运行资源。全部模型与纹理约 846 MiB，下载可重试；源码 ZIP 不重复打包这些大资源，仅附两份模型测试夹具。原始 Blender 工程、私人参考 PDF、开发账户数据库和密钥不在此包中。

```sh
npm test
node --test online-service/tests/race-api.test.mjs
node tools/sync-race-backend.mjs --check
npm run build:github
```

`dist-github` 是发布文件；GitHub Pages 子路径由 `vite.config.js` 中的 `base` 控制。部署到其他站点时按实际路径修改。根仓库的 `index.html` 是线上构建产物，此目录的 `index.html` 才是开发入口。可选浏览器验证脚本依赖本机 Edge 和运行中的本地开发服务，具体参数见脚本；不作为所有平台开箱即用的测试保证。

## 源码导航

- `src/main.js`：陆地世界、车辆、交互及主循环；`src/account.js`：账号与入口。
- `src/park-attractions.js`、`src/carnival-layout.js`：设施与乐园布局。
- `src/haunt-maze.js`、`src/rescue-story.js`：中式迷庭及解救剧情。
- `src/sky-chapter.js`、`src/sky-controls.js`、`src/sky-transfer.js`：奶使章节、飞行与连续起降。
- `src/collection.js`、`src/naifrog-layout.js`：图鉴与居民。
- `tests/`：游戏逻辑单元测试；`SOURCE-MANIFEST.json`：原始文件 SHA-256 清单。

## 联网服务

`src/online-config.js` 默认引用现有公开 race-api 服务地址，这是公共接口地址，不是密钥。可用 `VITE_ACCOUNT_API_ORIGIN` 指向自行部署的服务。`supabase/functions` 与 `supabase/migrations` 提供当前部署适配器和数据库结构，`online-service/lib/race-api.mjs` 与 `race-rules.mjs` 是业务逻辑源，`tools/sync-race-backend.mjs` 同步它们。

自建服务需要自己的 Supabase 项目、迁移和服务端数据库连接；连接秘密只配置在后端。不要对生产库运行 reset。普通前端运行及游客试玩不需要管理员密钥。PostgreSQL 集成测试需要额外 PGlite / postgres 依赖，见对应测试文件。账号、成绩与排行榜联网；其他探索进度仍有浏览器本地保存部分。排行榜是同路线个人最佳成绩排名，不是多人实时对战，也不代表完整服务端物理反作弊。

## Lux3D 与素材说明

Lux3D 用于三维资产生成与迭代，资产还需尺度、材质、座位、碰撞和性能处理后接入 Three.js。部分角色来自创作者提供的 Blender 模型，不把所有角色归为 Lux3D 原生生成。此公开资料面向项目评审；程序依赖许可见 `THIRD_PARTY_NOTICES.txt`。角色形象、参考图与第三方美术资产不因代码公开而自动获得商用授权，请分别核查来源及授权。

截图与开发阶段、性能测量条件、已知限制详见项目报告。旧截图中的项目旧称及旧图鉴数量保留为过程记录。
