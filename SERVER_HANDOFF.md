# 服务器部署交接提示

服务器：`root@8.134.200.248:22`
域名：`demo.hekecm.com`
项目目录：`/opt/lumenhaus`
Next.js 端口：`3000`
Nginx 公网端口：`80`

## SSH

本次维护使用的私钥路径：`F:\dulizhgan\.server-access\id_ed25519`

公钥已经由用户通过阿里云控制台添加到服务器 `/root/.ssh/authorized_keys`。

连接命令：

```powershell
ssh -i F:\dulizhgan\.server-access\id_ed25519 -p 22 root@8.134.200.248
```

## 当前项目状态

- 本地已初始化 Git。
- 远程仓库：`https://github.com/xhhzky3344/dome.git`
- 本地提交：`749e267 Initial sync of Lumenhaus site`
- Git 提交用户：`xhhzky3344`
- Git 提交邮箱：`2280780124@qq.com`
- GitHub 推送尚未确认成功。
- 服务器执行 `npm ci` 时提示锁文件不同步，缺少 `@emnapi/runtime@1.11.3` 和 `@emnapi/core@1.11.3`，应使用 `npm install --include=optional`。
- Nginx 已配置 HTTP 80；Certbot 已安装，SSL 尚未完成。2026-09-11 实测服务器访问 Let's Encrypt API 已恢复 HTTP 200，但三次证书申请均因签发机构 secondary validation 查询域名 A/AAAA 或 CAA 时出现 DNS networking error 失败。
- 本机、服务器、公共 DNS（1.1.1.1 / 8.8.8.8）及权威 DNS 抽查解析正常，A 记录为 `8.134.200.248`；需要排查权威 DNS 的异地可达性，或提供其他 CA 签发的证书。不要持续重复正式申请。
- SSL 操作前的 Nginx 配置备份：`/root/nginx-before-ssl-20260911`。失败后 `nginx -t` 通过，HTTP 网站返回 200。`certbot.timer` 已存在，但没有签发成功的证书，自动续期尚未验证。

## 下一步

1. SSH 登录服务器并确认 `/opt/lumenhaus`。
2. 如尚未安装环境，安装 Git、Node.js、npm、PM2。
3. 在项目目录执行：

```bash
git pull origin main
npm install --include=optional
npm run build
pm2 restart lumenhaus || pm2 start npm --name lumenhaus -- start
pm2 save
```

4. 配置 Nginx，将 `demo.hekecm.com:80` 反向代理到 `127.0.0.1:3000`。
5. 放行 CentOS 防火墙和阿里云安全组 TCP 80。
6. 确认 DNS A 记录 `demo.hekecm.com` 指向 `8.134.200.248`。

## Nginx 配置核心内容

```nginx
server {
    listen 80;
    server_name demo.hekecm.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 注意

- 不要提交或泄露私钥。
- 更新前备份服务器 `data/` 和 `public/uploads/`。
- 后台演示账号：`admin` / `demo-2026`，正式上线前必须修改。
