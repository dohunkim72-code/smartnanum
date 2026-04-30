import paramiko

host = "210.114.22.136"
user = "root"
password = "Ch070809"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=password)

# Check columns in endDate table (camelCase)
stdin, stdout, stderr = ssh.exec_command('mysql -u root -p\'Ch070809\' smartnanum_db -e "DESCRIBE endDate;"')
print("STDOUT:", stdout.read().decode(errors='ignore'))
print("STDERR:", stderr.read().decode(errors='ignore'))

ssh.close()
