import hashlib
import logging
import secrets
import time

logger = logging.getLogger("app.challenge")

CHALLENGE_TTL = 300
DEFAULT_DIFFICULTY = 16
challenges: dict[str, dict] = {}


def generate_challenge(difficulty: int = DEFAULT_DIFFICULTY) -> dict:
    nonce = secrets.token_hex(16)
    challenges[nonce] = {
        "created_at": time.time(),
        "difficulty": difficulty,
        "used": False,
    }
    return {"nonce": nonce, "difficulty": difficulty}


def verify_pow(nonce: str, counter: int, payload_str: str, difficulty: int) -> bool:
    data = f"{nonce}{counter}{payload_str}".encode()
    digest = hashlib.sha256(data).digest()
    hash_int = int.from_bytes(digest, "big")
    leading_zeros = 256 - hash_int.bit_length()
    return leading_zeros >= difficulty


def consume_challenge(nonce: str) -> dict | None:
    challenge = challenges.pop(nonce, None)
    if challenge is None:
        return None
    if challenge.get("used"):
        return None
    if time.time() - challenge["created_at"] > CHALLENGE_TTL:
        return None
    challenge["used"] = True
    return challenge


def cleanup_challenges():
    now = time.time()
    expired = [k for k, v in challenges.items() if now - v["created_at"] > CHALLENGE_TTL]
    for k in expired:
        challenges.pop(k, None)
