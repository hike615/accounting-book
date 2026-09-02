from fastapi import APIRouter, Form, HTTPException
from ..database import get_db
from ..utils import hash_password, create_token

router = APIRouter()

@router.post("/api/register")
def register(username: str = Form(...), password: str = Form(...)):
    if len(username) < 3:
        raise HTTPException(status_code=400, detail="用户名至少3个字符")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="密码至少6个字符")

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE username = %s", (username,))
    if cur.fetchone():
        cur.close()
        conn.close()
        raise HTTPException(status_code=400, detail="用户名已被注册")

    pwd_hash = hash_password(password)
    cur.execute("INSERT INTO users (username, password_hash) VALUES (%s, %s)", (username, pwd_hash))
    conn.commit()
    user_id = cur.lastrowid
    cur.close()
    conn.close()

    # 注册成功自动签发 Token（注册即登录）
    token = create_token(user_id)
    return {"code": 200, "msg": "注册成功", "data": {"id": user_id, "username": username, "token": token}}

@router.post("/api/login")
def login(username: str = Form(...), password: str = Form(...)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, username, password_hash, is_admin FROM users WHERE username = %s", (username,))
    user = cur.fetchone()
    cur.close()
    conn.close()

    if not user or user["password_hash"] != hash_password(password):
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    token = create_token(user["id"])
    return {"code": 200, 
            "msg": "登录成功", 
            "data": {
                "id": user["id"], 
                "username": user["username"], 
                "token": token,
                "is_admin": user["is_admin"]
            }
        }