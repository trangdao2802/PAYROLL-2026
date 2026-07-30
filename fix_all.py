import re

with open("src/app/pages/04-balance/BulkPayment.tsx", 'r') as f:
    content = f.read()

# Let's count properly and print the lines at the end of the IIFE
lines = content.split('\n')
for i, line in enumerate(lines):
    if "                    })()" in line:
        print(f"Line {i+1}: {line}")
        print("\n".join(lines[i-5:i+5]))
        print("-------------")
