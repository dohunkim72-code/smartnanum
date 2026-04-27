import paramiko

def check_success():
    host = '210.114.22.136'
    user = 'root'
    pw = 'Ch070809'

    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(host, username=user, password=pw)
        
        # Check standard output logs for "서버가 포트 3000에서 작동 중입니다."
        stdin, stdout, stderr = ssh.exec_command("pm2 logs smartnanum --lines 20 --out --no-daemon")
        import time
        time.sleep(2)
        if stdout.channel.recv_ready():
            print("--- PM2 OUT LOGS ---")
            print(stdout.channel.recv(4096).decode(errors='replace'))
            
        ssh.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_success()
