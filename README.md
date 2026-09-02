# 📒 多用户记账本系统

基于 **FastAPI + 原生 JavaScript** 构建的轻量级多用户记账本。支持用户注册登录、账单的增删改查、分类筛选、数据导出，以及管理员后台的用户管理功能。

---

## ✨ 功能特性

### 👤 用户端
- **用户认证**：注册 / 登录，基于 JWT 的身份验证，支持“注册即登录”
- **账单管理**：新增、编辑、删除账单，支持收入 / 支出分类
- **筛选搜索**：按类型（全部 / 收入 / 支出）筛选，按备注关键词搜索
- **数据导出**：一键导出当前账单列表为 Excel 文件（.xlsx）
- **响应式交互**：Toast 轻提示、弹窗编辑、回车快捷提交

### 🛡️ 管理员端
- **账单总览**：查看所有用户的账单，显示所属用户名
- **用户管理**：查看注册用户列表，支持启用 / 禁用账号
- **权限隔离**：普通用户只能操作自己的数据，管理员拥有全局视角

---

## 🛠️ 技术栈

| 层级 | 技术 |
| :--- | :--- |
| 后端 | Python 3.10+ / FastAPI / PyMySQL / JWT / openpyxl |
| 前端 | 原生 HTML / CSS / JavaScript |
| 数据库 | MySQL 8.0 |
| 部署 | 支持 Docker 容器化，或 Gunicorn + Nginx 部署 |

---

## 📁 项目结构
记账本/
├── app/ # 后端核心代码
│ ├── routers/ # 路由层（auth, orders）
│ │ ├── auth.py # 登录 / 注册
│ │ └── orders.py # 账单 CRUD + 管理员接口
│ ├── init.py
│ ├── config.py # 环境变量配置
│ ├── database.py # 数据库连接
│ ├── main.py # FastAPI 应用入口
│ └── utils.py # 工具函数（JWT, 密码加密）
├── static/ # 前端静态文件
│ ├── index.html # 主页面
│ ├── style.css # 全局样式
│ └── app.js # 前端交互逻辑
├── .env # 环境变量（不提交）
├── .gitignore # Git 忽略文件
└── main.py # 项目启动入口

text

---

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/hike615/accounting-book.git
cd accounting-book
2. 创建并激活虚拟环境
bash
python -m venv venv
source venv/bin/activate      # Linux / Mac
# venv\Scripts\activate       # Windows
3. 安装依赖
bash
pip install -r requirements.txt
如果没有 requirements.txt，手动安装：

bash
pip install fastapi uvicorn pymysql python-dotenv pyjwt openpyxl
4. 配置 MySQL 数据库
sql
CREATE DATABASE money_db;
然后执行项目中的建表 SQL（详见 database.sql 或自行创建 users 和 orders 表）。

5. 配置环境变量
在项目根目录创建 .env 文件：

ini
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的数据库密码
DB_NAME=money_db
SECRET_KEY=你的随机密钥
6. 启动服务
bash
python main.py
访问 http://127.0.0.1:8000 即可使用。

🔐 默认管理员账号
用户名	密码	角色
dm123	dm123	管理员
⚠️ 首次登录后请在数据库中修改密码。

📸 界面预览
登录界面	记账主界面	管理后台
(待添加截图)	(待添加截图)	(待添加截图)
📌 后续规划
☑ 多用户支持
☑ JWT 鉴权
☑ 管理员后台（账单总览 + 用户管理）
☑ Excel 数据导出
□ Docker 容器化
□ 数据可视化（图表统计）
□ 操作日志记录
□ 用户自助修改密码
📄 许可证
MIT License

🙋 作者
GitHub：hike615