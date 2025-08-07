# this is a comment
# this file im going to learn how to put comments and use the print function
# print must always be lowercase
# dont indent a print
#print ("Hello World :D")  # This is an inline comment
#"""comment"""  # This is a comment

# for a new line (only for print function) put a \n
#print ("line 1 \nline 2") 

# for a 'tab in' use \t (also only for print function)
#print ("test 1 \ttest 2")

# If using single quotes, if you are using a ' in your word you must use a \
# print ('It\'s a lovely day')  works but,
# print ('It's a lovely day')   doesnt work

# use ' if you are using " in your print functions and use a \ if you are using ' in a word
#print('It is "warm"')
#print ('It\'s "warm"')
#print ("It\'s warm")
#print ('It\'s warm')

# When putting in a directory like C:\User\Name, you need to use two back slashes
#print ('go to C:\\Users\\frg45') # this will work

# For indenting print words use \t for as many indents as you want
#print("No indent")
#print("\tOne indent")
#print("\t\tTwo indents")


# Week 2 revision from last week
#print("28/07/2025")
#print("Hello world")
#print('It\'s a nice day')
#print('It\'s a \nnice day')

#age = 20
#Age = 200
#print(age)
#print(Age)
#age = 100
#print(age)
#age = 106

# Can't start a veriable with a number however it can end with one
# _myAge will work but not good practice
# my-Age doesnt work beacuse the '-' is not valid

# Camel case: myVariableName = everything but the first is capatilized
# Pascal Case: MyVariableName = everything is capital
# Snake Case: my_variable_name = uses underscores to sperate words

#User_Name = "BC"    # this is a string class (letters)
#Calculate = 1000    # this is a integer class (numbers)
#First_Name = "Brendan"
#Get_User_Data = "Yes"
#Price = 100.00      # this is a float class (numebers with a decimal)

#print (type(User_Name)) # this will tell me what type of class this specific line is for 60-64
#print (type(Calculate))
#print (type(First_Name))
#print (type(Get_User_Data))
#print (type(Price))

#FirstName = "Brendan"
#print (FirstName)
#print (type(FirstName))

#x = str(3)    # x will be '3'
#y = int(3)    # y will be 3
#z = float(3)  # z will be 3.0

#FullUsersName, AGE, FavFood, Salary = "Terry", 96, "Pasta", 196.33
#print(FullUsersName)
#print(AGE)
#print(FavFood)
#print(Salary)

#FullUsersName = str(FullUsersName)
#AGE = int(AGE)
#FavFood = str(FavFood)
#Salary = float(Salary)

#studentID = "1234567890"
#CellPhoneNumber = "123 456 7890"
#Just because something has numbers in it, doesnt mean it should be a str(string) | e.g someones ID number doesnt change so it should be a str. Same with someones phone number

# 30/07/2025
# variable revision
#Age = 20                                    # this will default to a Int
#print(Age)
#print(type(Age))                            # this will show me hey yes Age = 20 is an Int
#Age = str(20)                               # this tells age you are a Str instead
#print(type(Age))                            # it will how tell me this is a Str
#Name = "Brendan"                            # anything that has "" is gonna show up as a Str
#print(Name)
#print(type(Name))                           # what is this? Its printing that its a Str
#LastName = "Chapman"
#print(LastName)
#print(type(LastName))
#Subject = "Software Design & Development"
#CourseName = "CITE404"
#print(Subject)
#print(type(Subject))
#HourlyRate = '$30.00'                       # chat do i really earn this much (maybe neheheh)
#print(HourlyRate)                           # anything with these 00.00 "." will show up as a float
#print(type(HourlyRate))                     # yep this proves correct it is infact a float

#info = f"Hi, {Name}"                        # info is our tag for "Hi, Name('Brendan' in our case)"
#print (info)                                #

#Intro = f"Morning {Name} {LastName} you're {Age} years old. \n\tYou are in {CourseName}, {Subject}. \n\t\tCurrently your hourly rate is {HourlyRate}!"  # the {word} is a tag, not the actual word being assigned
#print (Intro)



# 04/08/2025
#fstring and imput

#FirstName="Brendan"
#Age=20
#message = f"hi {Name}, your age is {Age}"
# print (message)

#allergy1 = "gluten free"
#allergy2 = "egg free"
#preference = f"Hello {Name}, you're {Age} years old today, You're food preference is {allergy1} and {allergy2}."
#print (preference)

# this is the basics of 'fstring'

#FirstName="Brendan"
#LastName="Chapman"
#Age=20
#print (f"Your name is {FirstName} {LastName} and you're {Age} years old")

#FirstName = input("What is your first name: ")
#print(f"Hello {FirstName}!")  # Prints immediately after entering the name
#LastName = input("What is your last name: ")
#print(f"{FirstName} {LastName}!")
#Age = input("How old are you? ")
#print(f"you're {Age} today.")
#FoodAllergy = input("What is your food allergy: ")
#print(f"damn okay, lets keep going")
#Information = input("Would you like further information: ")
#print (f"Lets keep going")
#UsedProduct = float(input("How many times have you used this product: "))
#print(f"noted, thank you!")

#print("These are your inputs...")
#print(FirstName)
#print(LastName)
#print(FoodAllergy)
#print(Information)
#print(UsedProduct)
#print(type(UsedProduct))  # User must type in a number for this to work
#print(" ")

#print(f"Thanks {FirstName} you have stated you have used our product {UsedProduct} times.")
#print (f"Since you said {Information} to receiving further information an email may be on its way.")
#print (f"At {Age} and with your {FoodAllergy} allergy, the information on the email will keep you healthy.")


# 04/08/2025
# fstring and input with a shopping list

#Date = input("What is todays date?: ")
#FirstName = input("What is your first name?: ")
#LastName = input("What is your last name?: ")
#print(f"Hello {FirstName} {LastName}, welcome to The Store!")
#print(f"Today is {Date}, lets go shopping!")


#Go = input("Welcome to The Store! \nWe have drinks and food. \nWhere do you wanna go... | Drinks/Food?: ")

#if Go == "Food":
#    print ("You walk to the Food isle. \nThere are 3 Foods; \n\t- Pizza \n\t- Burger \n\t- Salad")
#    Food = input("What food do you want? | Pizza/Burger/Salad: ")
#    if Food == "Pizza":
#        if "Y" in input("You grab a pizza, do you want to buy more? | Y/N: "):
#            print("You buy another Pizza")
#    elif Food == "Burger":
#        if "Y" in input("You grab a burger, do you want to buy more? | Y/N: "):
#            print("You buy another Burger")
#    elif Food == "Salad":
#        if "Y" in input("You grab a salad, do you want to buy more? | Y/N: "):
#            print("You buy another Salad")
#    Drinks = "None"
#
#elif Go == "Drinks":
#    print ("You walk to the Drinks isle. \nThere are 3 Drinks; \n\t- Energy Drinks \n\t- Juice \n\t- Coffee")
#    Drinks = input("What drink do you want? | Energy/Juice/Coffee: ")
#    if Drinks == "Energy":
#        if "Y" in input("You grab an energy drink, do you want to buy more? | Y/N: "):
#            print("You buy another Energy Drink")
#    elif Drinks == "Juice":
#        if "Y" in input("You grab a juice, do you want to buy more? | Y/N: "):
#            print("You buy another Juice")
#    elif Drinks == "Coffee":
#        if "Y" in input("You grab a coffee, do you want to buy more? | Y/N: "):
#            print("You buy another Coffee")
#    Food = "None"
#
#else:
#    print("ERRR UR WRONG! *dies*")
#    Food = "None"
#    Drinks = "None"
#
#print("You have finished shopping, thank you for coming to The Store!")
#print(f"\tThanks for shopping with us {FirstName} {LastName} on {Date}! \nYour shopping list is: \n\t{Food} \n\t{Drinks}")







#06/08/2025
#MATH WOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO

#quick recap
#FirstName = input("What's your first name: ")
#LastName = input("What's your last name: ")
#Pets = int(input("How many pets do you have: "))

#print (f"Hello {FirstName} {LastName}, I see you have {Pets} pets!")
#print(type(Pets))

# math time !!
#Age = int(input("How old are you? "))
#increase = int(input("What is the increase? "))
#NewAge = Age + increase
#print (Age)
#print (NewAge)
#print ((f"You're currently {Age} and it will be {increase} years before you are {NewAge}"))

### I PUT IF STATEMENTS JUST TO PLAY AROUND WITH THINGS, STILL UNRELATED
#Age = int(input("How old are you now? "))
#LicenseAge = int(input("What age can you get your license? "))
#License = LicenseAge - Age
#if Age > License:
#    print ("You're old enough to get your lisence!")
#elif Age < License:
#    print ((f"you're currently {Age} and need to wait {License} years until you can get you license at {LicenseAge}"))

#Name = (input("What is the name of what you want to buy? "))
#Price = input(f"How much is {Name} going to cost each? ")
#Price = int(Price)
#Sold = input(f"How many {Name} do you want to buy? ")
#Sold = int(Sold)

#Total = Sold * Price
#print ((f"you grab {Sold} {Name}s, This will cost a total of {Total}"))

#InvoiceNumber = (input("What is your Invoice number? "))
#ClientName = (input("What is your Name? "))
#Item1 = (input("What is the first item you want to buy? "))
#Amount1 = int(input(f"How how many {Item1} do you want? "))
#Price1 = int(input(f"What is the price if {Item1} each? "))
#Item2 = (input("What is the second item you want to buy? "))
#Amount2 = int(input(f"How many {Item2} do you want? "))
#Price2 = int(input(f"What is the Price of {Item2} each?"))
#Cost1 = Amount1 * Price1
#Cost2 = Amount2 * Price2
#GST = 0.11
#Total = Cost1 + Cost2
#Final = Total * GST
#print (f"You have {Amount1} {Item1}s costing a total of ${Cost1} and {Amount2} of {Item2} Costing ${Cost2}")
#print (f"Cost before tax is ${Total}")
#print (f"Your grand total is ${Final}")
#print (f"Thank you for shopping with us {ClientName}!")
 # GST ISNT WORKING RIGHT HERE




# 07/07/2025
# Divisions

