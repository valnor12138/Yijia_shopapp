# Netlify 环境变量导入指南

## 方法一：在 Netlify 控制台手动添加

1. 登录 Netlify：https://app.netlify.com
2. 选择你的站点
3. 进入：**Site settings** → **Environment variables**
4. 点击 **Add variable**，逐个添加以下变量：

### 前端环境变量（用于 Coze 聊天）

| Key | Value |
|-----|-------|
| `VITE_COZE_BOT_ID` | `7587693887050203162` |
| `VITE_COZE_TOKEN` | `pat_KZG9X9M0SPp1H9Lx2UUdJLJqu7JGW7Xd97dJvA3GVUJORDsVKvULePowZF2PH9N1` |

### 后端环境变量（用于数据库连接）

| Key | Value |
|-----|-------|
| `DB_USER` | `rou_9999` |
| `DB_PASSWORD` | `kl87ngG@f` |
| `DB_SERVER` | `tag.qyyjtr.com` |
| `DB_PORT` | `6899` |
| `DB_NAME` | `enjoy_shq_test` |

## 方法二：使用 Netlify CLI（如果已安装）

```bash
# 安装 Netlify CLI（如果未安装）
npm install -g netlify-cli

# 登录 Netlify
netlify login

# 设置环境变量
netlify env:set VITE_COZE_BOT_ID "7587693887050203162"
netlify env:set VITE_COZE_TOKEN "pat_KZG9X9M0SPp1H9Lx2UUdJLJqu7JGW7Xd97dJvA3GVUJORDsVKvULePowZF2PH9N1"
netlify env:set DB_USER "rou_9999"
netlify env:set DB_PASSWORD "kl87ngG@f"
netlify env:set DB_SERVER "tag.qyyjtr.com"
netlify env:set DB_PORT "6899"
netlify env:set DB_NAME "enjoy_shq_test"
```

## 注意事项

- ✅ 所有环境变量都需要设置
- ✅ 变量名必须完全匹配（区分大小写）
- ✅ 设置后需要**重新部署**才能生效
- ✅ 环境变量在构建时（VITE_*）和运行时（DB_*）都可用
