#1/09/2025
#Intro to if, elif, else statements

age=18
if age>18:
   print("You can vote.")

password = "password"
if password=="password":
   print("That is the correct password")
elif password !="password":
   print("Sorry thats the wrong password")

age = 17
if age >= 16 or age ==17: # using an 'and' means both are true, using 'or' means its one or the other are true
   print("You can vote!")
   print("Congratulations!")

age = int(input("How old are you?"))
if age >= 13:
   print("You're a teenager")
if age <= 19:
   print("you're a teenager")
if age < 13:
   print("You're a child")

number = int(input("Put a number to find out if it is positive or negative: "))
if number == 0:
   print("That number is 0")
if number > 0:
   print("That number is a positive")
if number < 0:
   print("That number is a negative")

number = int(input("Enter a number to see if it is odd or even: "))
if number %2 == 0:
   print("This number is even!")
if number %2 != 0:
   print("this number is odd!")

Num = int(input("Enter a number: "))
DivNum = int(input("What do you want to divide by? "))
if Num % DivNum == 0:
   print(f"This number is divisable by {DivNum}")

Result = int(input("What is your test score? "))
if Result >= 50:
   print ("Thats a pass!")
elif Result < 50:
   print ("Thats a fail")

Temp = int(input("How hot is it outside? "))
if Temp > 30:
   print("It's toasty outside!")
else:
   print("It's not too hot outside.")

Temp = int(input("What is the temp outside? "))
if Temp >= 21:
    print("you dont need many layers, its warm")
elif Temp > 0 and Temp <= 20:
    print("You need a hoodie")
elif Temp == 0:
    print("you need a jacket")
else:
    print("You need many layers, it's freezing!")




# 3/09/2025
# write code revision
Day = input("What day of the week is it?\nMon, Tue, Wed, Thr, Fri, Sat, Sun? ") .strip().title() 
if Day == "Mon" or Day == "Wed": #.strip() removes spaces, .title() adds caps for input
   print("we have CITE 404 today")
elif Day == "Tue" or Day == "Thr":
   print("We have 402 today")
else:
   print("We have no classes today")

# Pseudocode & testing plan written from paper copy
PieCost = 6.00
CoffeeCost = 6.50
PieCount = int(input("How many pies do you want? "))
CoffeeCount = int(input("How many coffees do you want? "))
if PieCount >0 and CoffeeCount>0:
   PiePrice = PieCount*PieCost
   CoffeePrice = CoffeeCost*CoffeeCount
   Total = CoffeePrice + PiePrice
   print(f"Your total is ${Total}")
else:
   print("Goodbye")
