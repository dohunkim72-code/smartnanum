import paramiko

def fix_port_conflict():
    host = "210.114.22.136"
    user = "root"
    password = "Ch070809"
    remote_path = "/root/smartnanum"

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(host, username=user, password=password)
        print("--- FIXING PORT CONFLICT ---")
        
        # 1. 모든 PM2 프로세스 중지 및 삭제
        print("Stopping all PM2 processes...")
        ssh.exec_command("pm2 delete all")
        
        # 2. 3000번 포트를 강제로 사용하는 프로세스 kill (혹시 남아있을 경우 대비)
        print("Killing any process on port 3000...")
        ssh.exec_command("fuser -k 3000/tcp")
        
        # 3. 신버전 서버 실행
        print("Starting smartnanum-server...")
        stdin, stdout, stderr = ssh.exec_command(f"cd {remote_path}/server && pm2 start app.js --name smartnanum-server")
        
        print(stdout.read().decode('utf-8', errors='ignore'))
        print(stderr.read().decode('utf-8', errors='ignore'))
        
        # 4. 상태 확인
        print("Checking PM2 status...")
        stdin, stdout, stderr = ssh.exec_command("pm2 list")
        print(stdout.read().decode('utf-8', errors='ignore'))

        print("Port conflict resolved and server restarted! [SUCCESS]")

    except Exception as e:
        print(f"Failed to fix conflict: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    fix_port_conflict()
