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




# # 3/09/2025
# # write code revision
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


#Question2
#BrendanC

Number = float(input("Please enter a number: "))
if Number <= 0:
    print("Invalid number - Try again!")
elif Number % 5 == 0:
    print(f"The number {Number} is divisable by 5.")
else:
    print(f"This number {Number} is not a multiple of 5")

#Question3
#BrendanC

Grade = float(input("What was your grade? ")) 
if Grade <0 or Grade > 100:
    print ("Invalid Number - try again!")
elif Grade >= 80 and Grade <= 100:
    print (f"You passed with a grade of {Grade}, and will get an A+, excellent result.")
elif Grade >= 65 and Grade < 80:
    print (f"You passed with a grade of {Grade}, and will get a B, well done!")
elif Grade >= 50 and Grade < 65:
    print (f"You passed with a grade of {Grade}, well done!")
else:
    print(f"Your grade of {Grade} was not enough to pass.")

#Question4
#BrendanC


Temp=input(int("Enter the temperature in °C:"))
Raining=input(int("Is it raining? (yes/no) ")).strip().lower()

if Temp >= 30 and if Raining = "yes":
   print(f"Wear shorts and a t-shirt")
#Wear shorts and a t-shirt
#Wear light clothes
#Wear light clothes and take an umbrella
# "Wear a sweater
# "Wear a sweater and raincoat
# "Extreme weather - stay indoors!

# If it’s 30 or above and not raining, print "Wear shorts and a t-shirt".
# If it’s 20–29 and not raining, print "Wear light clothes".
# If it’s 20–29 and raining, print "Wear light clothes and take an umbrella".
# If it’s 10–19 and not raining, print "Wear a sweater".
# If it’s 10–19 and raining, print "Wear a sweater and raincoat".
# If it’s below 10  print "Extreme weather – stay indoors!".  