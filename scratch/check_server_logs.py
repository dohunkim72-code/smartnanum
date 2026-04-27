import paramiko

def check_logs():
    host = '210.114.22.136'
    user = 'root'
    pw = 'Ch070809'
    
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(host, username=user, password=pw)
        
        import sys
        sys.stdout.reconfigure(encoding='utf-8')
        
        print("PM2 상태 확인:")
        stdin, stdout, stderr = ssh.exec_command("pm2 status")
        print(stdout.read().decode('utf-8', 'ignore'))
        
        print("\nAPI 테스트 수행 (login):")
        stdin, stdout, stderr = ssh.exec_command('curl -X POST -H "Content-Type: application/json" -d \'{"id":"testuser","pw":"testpass"}\' http://localhost:3000/api/auth/login')
        print(stdout.read().decode('utf-8', 'ignore'))
        
        print("\n최근 에러 로그 확인:")
        stdin, stdout, stderr = ssh.exec_command("tail -n 20 /root/.pm2/logs/smartnanum-error.log")
        print(stdout.read().decode('utf-8', 'ignore'))
        
        ssh.close()
    except Exception as e:
        print(f"오류 발생: {e}")

if __name__ == "__main__":
    check_logs()
