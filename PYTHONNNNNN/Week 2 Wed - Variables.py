# 30/07/2025
# variable revision
Age = 20                                    # this will default to a Int
print(Age)
print(type(Age))                            # this will show me hey yes Age = 20 is an Int
Age = str(20)                               # this tells age you are a Str instead
print(type(Age))                            # it will how tell me this is a Str
Name = "Brendan"                            # anything that has "" is gonna show up as a Str
print(Name)
print(type(Name))                           # what is this? Its printing that its a Str
LastName = "Chapman"
print(LastName)
print(type(LastName))
Subject = "Software Design & Development"
CourseName = "CITE404"
print(Subject)
print(type(Subject))
HourlyRate = '$30.00'                       # chat do i really earn this much (maybe neheheh)
print(HourlyRate)                           # anything with these 00.00 "." will show up as a float
print(type(HourlyRate))                     # yep this proves correct it is infact a float

info = f"Hi, {Name}"                        # info is our tag for "Hi, Name('Brendan' in our case)"
print (info)                                #

Intro = f"Morning {Name} {LastName} you're {Age} years old. \n\tYou are in {CourseName}, {Subject}. \n\t\tCurrently your hourly rate is {HourlyRate}!"  # the {word} is a tag, not the actual word being assigned
print (Intro)