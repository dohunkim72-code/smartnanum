import paramiko

def check_status():
    host = "210.114.22.136"
    user = "root"
    password = "Ch070809"

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(host, username=user, password=password)
        print("--- CURRENT PM2 STATUS ---")
        stdin, stdout, stderr = ssh.exec_command("pm2 list")
        
        out = stdout.read().decode('utf-8', errors='ignore')
        # 윈도우 인코딩에 맞게 변환하여 출력
        print(out.encode('cp949', errors='replace').decode('cp949'))

    except Exception as e:
        print(f"Check failed: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    check_status()
