from validate_email import validate_email
import dns.resolver
from disposable_email_domains import blocklist
from email_validator import validate_email as syntax_validate, EmailNotValidError

def full_email_check(email: str):
    flags = []

    # 1. Syntax + Domain check
    try:
        valid = syntax_validate(email, check_deliverability=True)
        domain = valid.domain.lower()
    except EmailNotValidError:
        flags.append("Invalid")
        return flags

    # 2. Disposable domain check
    if domain in blocklist:
        flags.append("Disposable")

    # 3. MX record check
    try:
        mx_records = dns.resolver.resolve(domain, 'MX')
        if not mx_records:
            flags.append("No_mx_record")
            return flags
    except Exception:
        flags.append("No_mx_record")
        return flags

    # 4. SMTP check (py3-validate-email style)
    try:
        is_valid = validate_email(
        email_address=email,
        check_format=True,
        check_blacklist=True,
        check_dns=True,
        dns_timeout=10,
        check_smtp=True,
        smtp_timeout=10,
        smtp_helo_host='my.host.name',
        smtp_from_address='my@from.addr.ess',
        smtp_skip_tls=False,
        smtp_tls_context=None,
        smtp_debug=False)
        # print("IN TRY BLOCK", is_valid)
        if not is_valid:
            # print("IN IF BLOCK")
            flags.append("Mailbox_not_found")
    except Exception:
        print("IN EXCEPT BLOCK")
        flags.append("SMTP_check_failed")

    return flags
