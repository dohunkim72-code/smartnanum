import paramiko
import sys

def get_logs():
    host = "210.114.22.136"
    user = "root"
    password = "Ch070809"

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(host, username=user, password=password)
        print("--- SERVER LOGS (Last 50 lines) ---")
        
        # PM2 로그 확인
        stdin, stdout, stderr = ssh.exec_command("pm2 logs smartnanum-server --lines 50 --nostream")
        print(stdout.read().decode('utf-8', errors='ignore'))
        print(stderr.read().decode('utf-8', errors='ignore'))

    except Exception as e:
        print(f"Failed to fetch logs: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    get_logs()
