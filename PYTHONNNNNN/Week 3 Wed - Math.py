# 06/08/2025
# MATH WOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO

# quick recap
FirstName = input("What's your first name: ")
LastName = input("What's your last name: ")
Pets = int(input("How many pets do you have: "))

print (f"Hello {FirstName} {LastName}, I see you have {Pets} pets!")
print(type(Pets))

# math time !!
Age = int(input("How old are you? "))
increase = int(input("What is the increase? "))
NewAge = Age + increase
print (Age)
print (NewAge)
print ((f"You're currently {Age} and it will be {increase} years before you are {NewAge}"))

# I PUT IF STATEMENTS JUST TO PLAY AROUND WITH THINGS, STILL UNRELATED
Age = int(input("How old are you now? "))
LicenseAge = int(input("What age can you get your license? "))
License = LicenseAge - Age
if Age < License:
   print ("You're old enough to get your lisence!")
elif Age > License:
   print ((f"you're currently {Age} and need to wait {License} years until you can get you license at {LicenseAge}"))

Name = (input("What is the name of what you want to buy? "))
Price = input(f"How much is {Name} going to cost each? ")
Price = int(Price)
Sold = input(f"How many {Name} do you want to buy? ")
Sold = int(Sold)

Total = Sold * Price
print ((f"you grab {Sold} {Name}s, This will cost a total of {Total}"))

InvoiceNumber = (input("What is your Invoice number? "))
ClientName = (input("What is your Name? "))
Item1 = (input("What is the first item you want to buy? "))
Amount1 = int(input(f"How how many {Item1} do you want? "))
Price1 = int(input(f"What is the price if {Item1} each? "))
Item2 = (input("What is the second item you want to buy? "))
Amount2 = int(input(f"How many {Item2} do you want? "))
Price2 = int(input(f"What is the Price of {Item2} each?"))
Cost1 = Amount1 * Price1
Cost2 = Amount2 * Price2
GST = 0.11
Total = Cost1 + Cost2
Final = Total * GST
print (f"You have {Amount1} {Item1}s costing a total of ${Cost1} and {Amount2} of {Item2} Costing ${Cost2}")
print (f"Cost before tax is ${Total}")
print (f"Your grand total is ${Final}")
print (f"Thank you for shopping with us {ClientName}!")
# GST ISNT WORKING RIGHT HERE
