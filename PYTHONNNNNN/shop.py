# Sparky's Store

# I want an intro to what it is that is going on 
# "Welcome to Sparkys Store, date etc" 
# I want to present the user with what the store has avalable and where they can go 
# places they could go would be in isles; Isle 1: pharmacy, Isle 2: snacks, Isle 3: drinks, Isle 4: bakery, Isle 5: dairy, Isle 6: Meats 
# i wanna setup a simple things that tells the user where they are and where their options are 
# The user needs a wallet with a set balance as they walk in so they have a limit 
# every item needs its own prices, make them reasonable 
# if a user cant afford something let them know they can and ask them if they wanna pay 
# the user needs a shopping cart list with them that they can check as they need to with prices of everything and the total price too 
# once the user has finished getting everthing they want they then need to checkout. 
# checkout just calculates the total price of everything together and prints a receipt 
# once user has checked out the store then says goodbye and the code finishes


# Store setup
items = {
    "Pharmacy": {"Painkillers": 12, "Bandages": 5, "Cough Syrup": 10},
    "Snacks": {"Chips": 3, "Chocolate": 2, "Candy": 1},
    "Drinks": {"Water": 2, "Soda": 3, "Juice": 4},
    "Bakery": {"Bread": 4, "Cake": 8, "Muffin": 3},
    "Dairy": {"Milk": 3, "Cheese": 6, "Yogurt": 2},
    "Meats": {"Chicken": 10, "Beef": 15, "Sausages": 7}
}

wallet = 100
cart = {}

# Intro
date = input("What is the date today?: ")
print(f"\nWelcome to Sparky's Store! \nDate: {date}")
print("We cater to all your needs including:\nPharmacy goods, Snacks, Drinks, Bakery, Dairy products, and Meats.")
print(f"You have ${wallet} in your wallet. Time to shop!\n")

# Store loop
while True:
    print("\nWhere do you wanna go?")
    print("1: Pharmacy | 2: Snacks | 3: Drinks | 4: Bakery | 5: Dairy | 6: Meats | 0: Checkout")

    choice = input("Type isle number or name: ").strip().capitalize()

    isle_map = {
        "1": "Pharmacy", "Pharmacy": "Pharmacy",
        "2": "Snacks", "Snacks": "Snacks",
        "3": "Drinks", "Drinks": "Drinks",
        "4": "Bakery", "Bakery": "Bakery",
        "5": "Dairy", "Dairy": "Dairy",
        "6": "Meats", "Meats": "Meats",
        "0": "Checkout"
    }

    if choice not in isle_map:
        print("Invalid input! Try again.")
        continue

    isle = isle_map[choice]

    if isle == "Checkout":
        print("\nCheckout time!")
        total = sum(price * qty for item, (price, qty) in cart.items())
        print("\nYour Receipt:")
        for item, (price, qty) in cart.items():
            print(f"{item} x{qty} - ${price * qty}")
        print(f"Total: ${total}")
        print(f"Wallet left: ${wallet - total}")
        print("\nThank you for shopping at Sparky's Store! 🦊 Goodbye!\n")
        break

    print(f"\nYou walk into the {isle} isle. Here’s what’s available:")
    for item, price in items[isle].items():
        print(f"- {item}: ${price}")

    pick = input("What do you want to buy? (or type 'back'): ").strip().title()
    if pick.lower() == "back":
        continue
    if pick not in items[isle]:
        print("That item doesn't exist here.")
        continue

    try:
        qty = int(input(f"How many {pick}s do you want? "))
    except ValueError:
        print("Please enter a valid number.")
        continue

    cost = items[isle][pick] * qty
    if cost > wallet - sum(price * qty for item, (price, qty) in cart.items()):
        print(f"You can't afford that! You only have ${wallet - sum(price * qty for item, (price, qty) in cart.items())} left.")
        continue

    if pick in cart:
        old_price, old_qty = cart[pick]
        cart[pick] = (old_price, old_qty + qty)
    else:
        cart[pick] = (items[isle][pick], qty)

    print(f"Added {qty} {pick}(s) to your cart!")

    # Show cart + running total
    total = sum(price * qty for item, (price, qty) in cart.items())
    print("\nYour cart:")
    for item, (price, qty) in cart.items():
        print(f"{item} x{qty} - ${price * qty}")
    print(f"Total so far: ${total} / Wallet: ${wallet}")
