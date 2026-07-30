import re

def count_braces(filename):
    with open(filename, 'r') as f:
        content = f.read()

    open_braces = content.count('{')
    close_braces = content.count('}')
    print(f"{{: {open_braces}")
    print(f"}}: {close_braces}")

    open_parens = content.count('(')
    close_parens = content.count(')')
    print(f"(: {open_parens}")
    print(f"): {close_parens}")

    open_divs = content.count('<div')
    close_divs = content.count('</div')
    print(f"<div: {open_divs}")
    print(f"</div: {close_divs}")
    
count_braces('src/app/pages/04-balance/BulkPayment.tsx')
