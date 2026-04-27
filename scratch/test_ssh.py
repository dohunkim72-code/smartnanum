import paramiko
import sys

def test_connection():
    host = '210.114.22.136'
    user = 'root'
    pw = 'Ch070809'

    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(host, username=user, password=pw)
        
        stdin, stdout, stderr = ssh.exec_command('ls /')
        print("접속 성공! 루트 디렉토리 목록:")
        print(stdout.read().decode())
        
        ssh.close()
    except Exception as e:
        print(f"접속 실패: {e}")

if __name__ == "__main__":
    test_connection()
