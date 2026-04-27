import paramiko
import sys

def run_setup():
    host = '210.114.22.136'
    user = 'root'
    pw = 'Ch070809'

    # Combine commands to run in a single session
    setup_script = """
    export DEBIAN_FRONTEND=noninteractive
    apt-get update
    apt-get install -y mysql-server curl build-essential
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    npm install -g pm2
    """

    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(host, username=user, password=pw)
        
        print("서버 설정 시작 (시간이 다소 소요될 수 있습니다)...")
        stdin, stdout, stderr = ssh.exec_command(setup_script)
        
        # Real-time output
        for line in iter(stdout.readline, ""):
            print(line, end="")
        
        err_output = stderr.read().decode()
        if err_output:
            print("\n[ERROR/WARNING LOGS]:")
            print(err_output)
            
        ssh.close()
        print("\n기본 프로그램 설치 완료!")
    except Exception as e:
        print(f"작업 중 오류 발생: {e}")

if __name__ == "__main__":
    run_setup()
