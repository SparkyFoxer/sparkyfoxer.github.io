# 11/08/2025
# Mathmatic Operators

# IncomeFromSale = 120
# CostPerItem = 30
# NumberSold = IncomeFromSale / CostPerItem
# print (NumberSold)
# print (type(IncomeFromSale))
# print (type(CostPerItem)) # integer because they are whole numbers
# print (type(NumberSold)) # float because it is a decimal number

# IncomeFromSale = float(input("What is the income from the sale? "))
# CostPerItem = float(input("What is the cost per item? "))
# NumberSold = IncomeFromSale / CostPerItem
# print (f"You sold {NumberSold} items at a cost of {CostPerItem} each, for a total income of {IncomeFromSale}.")

NumberOfApples = 17
NumberOfFriends = 3
ApplesPerFriend = NumberOfApples // NumberOfFriends
NumberOfApples = NumberOfApples%NumberOfFriends  # this will give the remainder of apples after splitting
print(f"Each friend gets {ApplesPerFriend} apples. After splitting the apples, you have {NumberOfApples} apples left over.")
print (type(ApplesPerFriend))  # This will show the type of ApplesPerFriend, which is an integer
print (f"You have {NumberOfApples} apples and {NumberOfFriends} friends, so each friend gets {ApplesPerFriend} apples, with {NumberOfApples} left over.")
NumberOfApples = int(input("How many apples do you have? "))
NumberOfFriends = int(input("How many friends do you have? "))
ApplesPerFriend = NumberOfApples // NumberOfFriends # this splits the apples evenly among friends
print(f"Each friend gets {ApplesPerFriend} apples.")
print (type(ApplesPerFriend))  # This will show the type of ApplesPerFriend, which is an integer
print (f"you have {NumberOfApples} apples and {NumberOfFriends} friends, so each friend gets {ApplesPerFriend} apples.")

# #Asking for input() and then making calculations
# NumberOfApples = int(input("How many apples do you have? ")) #input always returns a str so cast it to an int
# NumberOfFriends = int(input("How many friends do you want to share your apples with? ")) #input always returns a str so cast it to an int
# NumberEachGets = (NumberOfApples//NumberOfFriends) #this gives you the floor division = number of whole apples each friend gets
# NumberOfApplesLeft = (NumberOfApples%NumberOfFriends) #this gives you the modulus or remainder of apples left after sharing

# print (f"You have {NumberOfApples} apples and {NumberOfFriends} friends,"
#       f"they will each get {NumberEachGets} apples and " #rather than having a very long like of text across your screen, you can use f-strings to break it up
#       f"there will be {NumberOfApplesLeft} left for you to eat") #python joins the stings inside () automatically
 
