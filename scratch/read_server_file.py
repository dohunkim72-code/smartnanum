import paramiko

def read_server_file():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect('210.114.22.136', username='root', password='Ch070809')
        # authController.js의 275~310행 읽기
        cmd = 'sed -n "275,310p" /root/smartnanum/server/controllers/authController.js'
        stdin, stdout, stderr = ssh.exec_command(cmd)
        
        print("--- Server File Content (275-310) ---")
        print(stdout.read().decode())
        
    finally:
        ssh.close()

if __name__ == "__main__":
    read_server_file()
