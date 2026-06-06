import os

def rename_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception:
        # Skip binary files or decoding errors
        return

    updated = False
    
    # 1. Title brand case
    if "Priya PDF Editor" in content:
        content = content.replace("Priya PDF Editor", "Priya LifePDF")
        updated = True
        
    # 2. Slug brand case
    if "priya-pdf-editor" in content:
        content = content.replace("priya-pdf-editor", "priya-lifepdf")
        updated = True

    if updated:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {filepath}")

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    target_dirs = ['src', 'messages', 'public', 'scripts', '.github']
    target_files = ['package.json', 'next.config.js', 'tsconfig.json', 'Dockerfile', 'PHARMA_NOTICE.md', 'README.md']

    # Update specific files in root
    for filename in target_files:
        filepath = os.path.join(root_dir, filename)
        if os.path.exists(filepath):
            rename_in_file(filepath)

    # Update directories recursively
    for dir_name in target_dirs:
        dir_path = os.path.join(root_dir, dir_name)
        if not os.path.exists(dir_path):
            continue
            
        for root, _, files in os.walk(dir_path):
            for file in files:
                # Skip build outputs or lockfiles
                if file in ['package-lock.json', 'yarn.lock']:
                    continue
                filepath = os.path.join(root, file)
                rename_in_file(filepath)

if __name__ == '__main__':
    main()
