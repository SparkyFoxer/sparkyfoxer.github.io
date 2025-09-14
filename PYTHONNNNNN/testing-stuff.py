#Question1
#BrendanC

# Number = int(input("Please enter a number: "))
# if Number <=0:
#     print("This is an invalid number")
# elif Number % 2 == 0:
#     print("The number is even.")
# else:
#     print("The number is odd.")
# print("Thank you for your input.") #WORKING!!

#Question2
#BrendanC

Number = int(input("Please enter a number: "))
if Number<=0:
    print("Invalid number - Try again!")
elif Number%5<=0:
    print(f"The number {Number} is divisable by 5.")
else:
    print(f"This number {Number} is not a multiple of 5")