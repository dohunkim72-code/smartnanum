import paramiko

def check_remote_env():
    host = '210.114.22.136'
    user = 'root'
    pw = 'Ch070809'

    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(host, username=user, password=pw)
        
        stdin, stdout, stderr = ssh.exec_command("cat /root/smartnanum/server/.env")
        print("--- Remote .env ---")
        print(stdout.read().decode())
            
        ssh.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_remote_env()
