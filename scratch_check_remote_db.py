import paramiko

host = "210.114.22.136"
user = "root"
password = "Ch070809"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=password)

# Check databases using default root password (or no password)
stdin, stdout, stderr = ssh.exec_command('mysql -e "SHOW DATABASES;" || mysql -u root -p\'Ch070809\' -e "SHOW DATABASES;"')
print("STDOUT:", stdout.read().decode())
print("STDERR:", stderr.read().decode())

ssh.close()
