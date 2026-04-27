import paramiko
import os
import stat

def deploy():
    host = '210.114.22.136'
    user = 'root'
    pw = 'Ch070809'
    remote_path = '/root/smartnanum'
    local_base = r'c:\Users\LG\AI자동화\smartnanum'

    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(host, username=user, password=pw)
        sftp = ssh.open_sftp()

        print(f"원격 디렉토리 생성: {remote_path}")
        ssh.exec_command(f"mkdir -p {remote_path}")

        # 1. DB 설정
        print("데이터베이스 설정 중...")
        db_setup_cmds = f"""
        mysql -u root -e "CREATE DATABASE IF NOT EXISTS smartnanum_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
        """
        ssh.exec_command(db_setup_cmds)
        
        # schema.sql 업로드 및 실행
        print("schema.sql 업로드 및 실행 중...")
        sftp.put(os.path.join(local_base, 'schema.sql'), f"{remote_path}/schema.sql")
        ssh.exec_command(f"mysql -u root smartnanum_db < {remote_path}/schema.sql")

        # 2. 파일 업로드 (server 폴더와 dist 폴더)
        def upload_dir(local_dir, remote_dir):
            ssh.exec_command(f"mkdir -p {remote_dir}")
            for root, dirs, files in os.walk(local_dir):
                if 'node_modules' in dirs:
                    dirs.remove('node_modules')
                if '.git' in dirs:
                    dirs.remove('.git')
                
                rel_path = os.path.relpath(root, local_dir)
                if rel_path != ".":
                    target_dir = os.path.join(remote_dir, rel_path).replace("\\", "/")
                    ssh.exec_command(f"mkdir -p {target_dir}")
                
                for f in files:
                    local_file = os.path.join(root, f)
                    remote_file = os.path.join(remote_dir, rel_path, f).replace("\\", "/")
                    print(f"업로드 중: {f}")
                    sftp.put(local_file, remote_file)

        print("server 폴더 업로드 중...")
        upload_dir(os.path.join(local_base, 'server'), f"{remote_path}/server")
        
        print("dist 폴더 업로드 중...")
        upload_dir(os.path.join(local_base, 'dist'), f"{remote_path}/dist")

        # package.json (root에 있는 경우 대비 또는 server/package.json 확인)
        # 현재 구조상 server/package.json이 중요함
        
        # 3. 서버에서 npm install 및 실행
        print("서버에서 패키지 설치 및 실행 중...")
        run_cmds = f"""
        cd {remote_path}/server
        npm install
        pm2 delete smartnanum || true
        pm2 start app.js --name smartnanum
        pm2 save
        """
        stdin, stdout, stderr = ssh.exec_command(run_cmds)
        
        for line in iter(stdout.readline, ""):
            print(line, end="")
        
        err = stderr.read().decode()
        if err:
            print("\n[LOGS/WARNINGS]:")
            print(err)

        sftp.close()
        ssh.close()
        print("\n배포가 완료되었습니다! http://210.114.22.136:3000 에서 확인해보세요.")

    except Exception as e:
        print(f"배포 중 오류 발생: {e}")

if __name__ == "__main__":
    deploy()
