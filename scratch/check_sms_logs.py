import paramiko

def check_sms_logs():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect('210.114.22.136', username='root', password='Ch070809')
        
        query = "SELECT id, hpno, LENGTH(hpno) as len FROM cust WHERE id = 'oasis';"
        command = "mysql -u root -pCh070809 smartnanum_db -e \"{query}\"".format(query=query)
        
        stdin, stdout, stderr = ssh.exec_command(command)
        output = stdout.read().decode()
        error = stderr.read().decode()
        
        if output:
            print("=== SMS Log Results ===")
            print(output)
        else:
            print("No logs found for this number.")
            if error:
                print("Error:", error)
                
    finally:
        ssh.close()

if __name__ == "__main__":
    check_sms_logs()
