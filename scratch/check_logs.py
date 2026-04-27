import paramiko

def check_logs():
    host = '210.114.22.136'
    user = 'root'
    pw = 'Ch070809'

    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(host, username=user, password=pw)
        
        # Get PM2 logs
        stdin, stdout, stderr = ssh.exec_command("pm2 logs smartnanum --lines 50 --no-daemon")
        print("--- PM2 LOGS ---")
        # Read only a bit since it's a stream usually, but --no-daemon might help or just wait
        import time
        time.sleep(2)
        if stdout.channel.recv_ready():
            print(stdout.channel.recv(4096).decode(errors='replace'))
            
        ssh.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_logs()
