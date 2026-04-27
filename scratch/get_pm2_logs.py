import paramiko

host = "210.114.22.136"
user = "root"
password = "Ch070809"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(host, username=user, password=password)
    # PM2 로그 마지막 50줄 가져오기
    stdin, stdout, stderr = ssh.exec_command("pm2 logs smartnanum-server --lines 50 --nostream")
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    
    import sys
    # 윈도우 터미널 인코딩에 맞게 출력
    sys.stdout.buffer.write(out.encode('utf-8'))
    sys.stdout.buffer.write(err.encode('utf-8'))
except Exception as e:
    print(f"Error: {e}")
finally:
    ssh.close()
