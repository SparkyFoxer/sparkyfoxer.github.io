Date = input("What is todays date?: ")
FirstName = input("What is your first name?: ")
LastName = input("What is your last name?: ")
print(f"Hello {FirstName} {LastName}, welcome to The Store!")
print(f"Today is {Date}, lets go shopping!")

Go = input("Welcome to The Store! \nWe have drinks and food. \nWhere do you wanna go... | Drinks/Food?: ")
if Go == "Food":
    print ("You walk to the Food isle. \nThere are 3 Foods; \n\t- Pizza \n\t- Burger \n\t- Salad")
    Food = input("What food do you want? | Pizza/Burger/Salad: ")
    if Food == "Pizza":
        if "Y" in input("You grab a pizza, do you want to buy more? | Y/N: "):
            print("You buy another Pizza")
    elif Food == "Burger":
        if "Y" in input("You grab a burger, do you want to buy more? | Y/N: "):
            print("You buy another Burger")
    elif Food == "Salad":
        if "Y" in input("You grab a salad, do you want to buy more? | Y/N: "):
            print("You buy another Salad")
    Drinks = "None"

elif Go == "Drinks":
    print ("You walk to the Drinks isle. \nThere are 3 Drinks; \n\t- Energy Drinks \n\t- Juice \n\t- Coffee")
    Drinks = input("What drink do you want? | Energy/Juice/Coffee: ")
    if Drinks == "Energy":
        if "Y" in input("You grab an energy drink, do you want to buy more? | Y/N: "):
            print("You buy another Energy Drink")
    elif Drinks == "Juice":
        if "Y" in input("You grab a juice, do you want to buy more? | Y/N: "):
            print("You buy another Juice")
    elif Drinks == "Coffee":
        if "Y" in input("You grab a coffee, do you want to buy more? | Y/N: "):
            print("You buy another Coffee")
    Food = "None"

else:
    print("ERRR UR WRONG! *dies*")
    Food = "None"
    Drinks = "None"

print("You have finished shopping, thank you for coming to The Store!")
print(f"\tThanks for shopping with us {FirstName} {LastName} on {Date}! \nYour shopping list is: \n\t{Food} \n\t{Drinks}")
