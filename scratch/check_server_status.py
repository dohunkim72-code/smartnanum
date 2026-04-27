import paramiko
import json

def check_server():
    host = '210.114.22.136'
    user = 'root'
    pw = 'Ch070809'

    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(host, username=user, password=pw)
        
        # Check PM2
        stdin, stdout, stderr = ssh.exec_command("pm2 jlist")
        out = stdout.read().decode()
        try:
            data = json.loads(out)
            for proc in data:
                print(f"Process: {proc['name']}, Status: {proc['pm2_env']['status']}")
        except:
            print("PM2 jlist parsing failed")

        # Check Port
        stdin, stdout, stderr = ssh.exec_command("netstat -tlpn | grep 3000")
        print(f"Port 3000: {stdout.read().decode().strip()}")

        # Check Curl
        stdin, stdout, stderr = ssh.exec_command("curl -s -I http://localhost:3000 | head -n 1")
        print(f"Curl Response: {stdout.read().decode().strip()}")
            
        ssh.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_server()
