import paramiko
import os
from scp import SCPClient

def deploy():
    host = "210.114.22.136"
    user = "root"
    password = "Ch070809"
    remote_path = "/root/smartnanum"

    print(f"--- SERVER CONNECT: {host} ---")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(host, username=user, password=password)
        print("SSH CONNECT SUCCESS! [OK]")

        # SCP 클라이언트 생성
        with SCPClient(ssh.get_transport()) as scp:
            # 1. dist 폴더 업로드
            print("Uploading dist folder... [PUSH]")
            scp.put('dist', recursive=True, remote_path=remote_path)
            
            # 2. server 폴더 업로드 (node_modules 제외)
            print("Uploading server folder... [PUSH]")
            # 파일을 하나씩 올리는 것보다 폴더를 통째로 올리는 것이 빠르지만 node_modules는 제외해야 함
            for root, dirs, files in os.walk('server'):
                if 'node_modules' in dirs:
                    dirs.remove('node_modules')
                
                # 원격 경로 생성
                rel_path = os.path.relpath(root, '.')
                remote_dir = os.path.join(remote_path, rel_path).replace('\\', '/')
                
                ssh.exec_command(f"mkdir -p {remote_dir}")
                
                for file in files:
                    if file == '.env':
                        continue
                    local_file = os.path.join(root, file)
                    remote_file = os.path.join(remote_dir, file).replace('\\', '/')
                    scp.put(local_file, remote_file)

        print("File upload complete! [DONE]")

        # 3. 서버 재시작 (PM2)
        print("Restarting server (PM2)... [RESTART]")
        stdin, stdout, stderr = ssh.exec_command(f"cd {remote_path}/server && npm install && pm2 restart smartnanum-server || pm2 start app.js --name smartnanum-server")
        
        # 결과 출력 (윈도우 cp949 인코딩 에러 방지)
        def safe_print(msg):
            try:
                print(msg)
            except UnicodeEncodeError:
                print(msg.encode('cp949', errors='replace').decode('cp949'))

        out = stdout.read().decode('utf-8', errors='ignore')
        err = stderr.read().decode('utf-8', errors='ignore')
        
        safe_print(out)
        safe_print(err)
        
        print("Deployment finished successfully! [SUCCESS]")

    except Exception as e:
        print(f"Deployment failed: {e} [ERROR]")
    finally:
        ssh.close()

if __name__ == "__main__":
    deploy()
