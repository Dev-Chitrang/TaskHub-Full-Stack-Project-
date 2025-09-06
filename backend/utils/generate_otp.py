import random


def generate_2FA_otp():
    otp = random.randint(1000, 9999)
    return otp
