import sqlite3, random, os
from datetime import datetime, timedelta
from .config import DB_PATH

def main():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    if os.path.exists(DB_PATH): os.remove(DB_PATH)
    conn = sqlite3.connect(DB_PATH)
    
    conn.executescript("""
    CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT, email TEXT, country TEXT);
    CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, category TEXT, unit_price REAL);
    CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, order_date TEXT, delivery_date TEXT, status TEXT);
    CREATE TABLE order_items (id INTEGER PRIMARY KEY, order_id INTEGER, product_id INTEGER, quantity INTEGER, unit_price REAL);
    """)
    
    random.seed(42)
    countries = ["US", "UK", "DE", "FR", "IN", "CA"]
    conn.executemany("INSERT INTO customers VALUES (?,?,?,?)", [(i, f"User{i}", f"u{i}@ex.com", random.choice(countries)) for i in range(1, 51)])
    conn.executemany("INSERT INTO products VALUES (?,?,?,?)", [(i, f"Product-{i}", random.choice(["Electronics", "Books", "Clothing"]), round(random.uniform(5, 500), 2)) for i in range(1, 21)])
    
    base = datetime(2024, 1, 1)
    orders, items = [], []
    for oid in range(1, 300):
        od = base + timedelta(days=random.randint(0, 365))
        status = random.choice(["delivered", "shipped", "pending"])
        dd = (od + timedelta(days=5)).strftime("%Y-%m-%d") if status == "delivered" else None
        orders.append((oid, random.randint(1, 50), od.strftime("%Y-%m-%d"), dd, status))
        for _ in range(random.randint(1, 3)):
            pid = random.randint(1, 20)
            items.append((len(items)+1, oid, pid, random.randint(1, 5), 50.0))
            
    conn.executemany("INSERT INTO orders VALUES (?,?,?,?,?)", orders)
    conn.executemany("INSERT INTO order_items VALUES (?,?,?,?,?)", items)
    conn.commit()
    conn.close()
    print(f"Demo DB created at {DB_PATH}")

if __name__ == "__main__":
    main()