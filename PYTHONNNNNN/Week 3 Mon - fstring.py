# 04/08/2025
# fstring and imput

FirstName="Brendan"
Age=20
message = f"hi {FirstName}, your age is {Age}"
print (message)

allergy1 = "gluten free"
allergy2 = "egg free"
preference = f"Hello {FirstName}, you're {Age} years old today, You're food preference is {allergy1} and {allergy2}."
print (preference)

# this is the basics of 'fstring'

FirstName="Brendan"
LastName="Chapman"
Age=20
print (f"Your name is {FirstName} {LastName} and you're {Age} years old")

FirstName = input("What is your first name: ")
print(f"Hello {FirstName}!")  # Prints immediately after entering the name
LastName = input("What is your last name: ")
print(f"{FirstName} {LastName}!")
Age = input("How old are you? ")
print(f"you're {Age} today.")
FoodAllergy = input("What is your food allergy: ")
print(f"damn okay, lets keep going")
Information = input("Would you like further information: ")
print (f"Lets keep going")
UsedProduct = float(input("How many times have you used this product: "))
print(f"noted, thank you!")

print("These are your inputs...")
print(FirstName)
print(LastName)
print(FoodAllergy)
print(Information)
print(UsedProduct)
print(type(UsedProduct))  # User must type in a number for this to work
print(" ")

print(f"Thanks {FirstName} you have stated you have used our product {UsedProduct} times.")
print (f"Since you said {Information} to receiving further information an email may be on its way.")
print (f"At {Age} and with your {FoodAllergy} allergy, the information on the email will keep you healthy.")
