import paramiko
import os
from stat import S_ISDIR

def deploy():
    host = '210.114.22.136'
    user = 'root'
    pw = 'Ch070809'
    remote_path = '/root/smartnanum' # 이전에 작업했던 경로로 추정됩니다.

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print(f"Connecting to {host}...")
        ssh.connect(host, username=user, password=pw)
        print("Connected!")

        # 원격 경로 확인 및 생성
        ssh.exec_command(f'mkdir -p {remote_path}/server/config')
        ssh.exec_command(f'mkdir -p {remote_path}/dist')

        sftp = ssh.open_sftp()

        def put_dir(local_dir, remote_dir):
            for item in os.listdir(local_dir):
                if item == 'node_modules' or item == '.git' or item == '.gemini':
                    continue
                local_path = os.path.join(local_dir, item)
                rel_path = os.path.relpath(local_path, local_dir).replace('\\', '/')
                remote_item_path = f"{remote_dir}/{rel_path}"
                
                if os.path.isfile(local_path):
                    print(f"Uploading {local_path} to {remote_item_path}")
                    sftp.put(local_path, remote_item_path)
                elif os.path.isdir(local_path):
                    try:
                        sftp.mkdir(remote_item_path)
                    except:
                        pass
                    put_dir(local_path, remote_item_path)

        # 1. dist 폴더 업로드 (프론트엔드)
        print("Uploading dist folder...")
        put_dir('dist', f'{remote_path}/dist')

        # 2. server 폴더 업로드 (백엔드)
        print("Uploading server folder...")
        put_dir('server', f'{remote_path}/server')

        # 3. root 파일들 (package.json 등) 업로드
        for file in ['package.json', 'package-lock.json']:
            if os.path.exists(file):
                print(f"Uploading {file}...")
                sftp.put(file, f'{remote_path}/{file}')

        sftp.close()

        # 4. 서버 재시작 (PM2 사용 가정, 아니면 node 직접 실행)
        print("Restarting server...")
        # 기존 프로세스 확인 후 재시작
        stdin, stdout, stderr = ssh.exec_command(f'cd {remote_path} && npm install --production && pm2 restart smartnanum || pm2 start server/server.js --name smartnanum')
        print(stdout.read().decode())
        print(stderr.read().decode())

        print("Deployment complete!")
        ssh.close()

    except Exception as e:
        print(f"Deployment failed: {e}")

if __name__ == "__main__":
    deploy()
