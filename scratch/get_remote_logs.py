import paramiko
import os
from dotenv import load_dotenv

load_dotenv('server/.env')

def get_logs():
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect('210.114.22.136', username='root', password='Ch070809')
        
        stdin, stdout, stderr = ssh.exec_command('pm2 logs smartnanum-server --lines 50 --nostream')
        data = stdout.read()
        
        with open('scratch/remote_logs.txt', 'wb') as f:
            f.write(data)
            
        print("Logs saved successfully!")
        ssh.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_logs()
