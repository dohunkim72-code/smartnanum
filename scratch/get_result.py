import paramiko

host = "210.114.22.136"
user = "root"
password = "Ch070809"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(host, username=user, password=password)
    sftp = ssh.open_sftp()
    sftp.get('/root/result.txt', './result.txt')
    sftp.close()
    
    with open('./result.txt', 'r') as f:
        print(f.read())
except Exception as e:
    print(f"Error: {e}")
finally:
    ssh.close()
