import paramiko

host = "210.114.22.136"
user = "root"
password = "Ch070809"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=password)

# Fix .env file
commands = [
    "sed -i 's/DB_NAME=smartnanum/DB_NAME=smartnanum_db/g' /root/smartnanum/server/.env",
    "cat /root/smartnanum/server/.env",
    "cd /root/smartnanum/server && pm2 restart smartnanum-server"
]

for cmd in commands:
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(f"--- {cmd} ---")
    print("STDOUT:", stdout.read().decode())
    print("STDERR:", stderr.read().decode())

ssh.close()
