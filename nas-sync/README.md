# NAS 自动换图

家里的 NAS 每天定时把照片推送到 jkeroro.com：

- **首页 Snapshots 的某一格**（比如 dou dou）：每天从对应文件夹里随机挑一张换上，最近用过的 30 张尽量不重复
- **纪念日轮播**：整个文件夹镜像过去，文件夹里加/删照片，网站跟着加/删

只有 NAS 往外连网站，不需要开端口，也不需要把 NAS 暴露到公网。照片会先在 NAS 上摆正方向、缩到长边 2000px、转成 WebP 再上传；iPhone 的 HEIC 也支持。

## 部署（UGOS Pro 的 Docker → 项目）

1. 在 NAS 上建一个文件夹，比如 `/volume1/docker/jkeroro-nas-sync`，把这三个文件放进去：
   - `sync.py`
   - `docker-compose.yml`
   - `config.toml`（从 `config.example.toml` 复制一份改）
2. 建放照片的文件夹，比如 `/volume1/Photos/website/doudou`、`/volume1/Photos/website/anniversary`，把照片放进去
3. 改 `docker-compose.yml`：
   - `NAS_SYNC_TOKEN` 填网站的 token（和 Vercel 环境变量 `NAS_SYNC_TOKEN` 一样）
   - `volumes` 最后一行左边改成你放照片的那个文件夹
4. Docker → 项目 → 新建，路径选第 1 步的文件夹，用里面的 `docker-compose.yml` 启动
5. 看容器日志，应该会看到 `[slot] dou dou: 换成 xxx.jpg`

## 日常用

- 往文件夹里加照片就行（UGREEN 的 App、SMB、自动备份后挪进去都可以），第二天自动生效
- **想马上换一张**：`docker exec jkeroro-nas-sync python /app/sync.py --once`（或者在 Docker 里重启这个容器）
- 给其他格子接文件夹：在 `config.toml` 里加一段 `[[slot]]`，重启容器
- 纪念日里不想要的照片：从 NAS 文件夹里删，别在后台删（后台删了，下次同步会再加回来）

## 版本（不用管 merge 方式）

NAS 的 compose 按 tag 下载 `sync.py`：`.../nas-sync-<7 位 commit>/nas-sync/sync.py`，并校验 sha256。
main 上 `sync.py` 一有变化，GitHub Action（`.github/workflows/nas-sync-tag.yml`）会自动给那个 commit 打 tag。
tag 会让 commit 永久保留，所以 PR 用 merge commit 还是 squash 都没关系。
更新 NAS：Action 的运行摘要里有新的地址和 sha256，换进 compose 再 Redeploy。

## 安全

- token 只能调用网站的 `/api/nas/*`（换某一格的照片、增删纪念日里 NAS 推上去的照片），和后台登录是两套
- 文件夹是空的或者没挂载上时，不会删网站上的照片
- 照片文件夹以只读方式挂进容器，程序不会改动 NAS 上的任何照片
